package server

import (
	"net/http"

	"github.com/labstack/echo/v5"
)

func (s *Server) setupRoutes() {
	s.echo.GET("/health", s.healthCheck)

	v1 := s.echo.Group("/api/v1")

	// Auth routes (public)
	authGroup := v1.Group("/auth")
	authGroup.POST("/register", s.authHandler.Register)
	authGroup.POST("/login", s.authHandler.Login)
	authGroup.POST("/refresh", s.authHandler.Refresh)
	authGroup.POST("/otp/send", s.authHandler.SendOTP)
	authGroup.POST("/otp/verify", s.authHandler.VerifyOTP)
	authGroup.POST("/password/reset", s.authHandler.ResetPassword)
	authGroup.GET("/oauth/complete", s.authHandler.OAuthComplete)
	authGroup.GET("/oauth/:provider", s.authHandler.OAuthRedirect)
	authGroup.GET("/oauth/:provider/callback", s.authHandler.OAuthCallback)

	// Auth routes (protected)
	authProtected := authGroup.Group("", s.JWTAuth(s.authService.IsTokenBlacklisted))
	authProtected.POST("/logout", s.authHandler.Logout)
	authProtected.GET("/me", s.authHandler.GetMe)

	// Chatbot routes (public, with optional auth for personalization)
	chatbotGroup := v1.Group("/chatbot", s.OptionalJWTAuth(s.authService.IsTokenBlacklisted))
	chatbotGroup.POST("/chat/stream", s.chatbotHandler.ChatStream)
	chatbotGroup.DELETE("/session/:sessionId", s.chatbotHandler.DeleteSession)
	chatbotGroup.GET("/session/:sessionId", s.chatbotHandler.GetSession)

	// Internal chatbot endpoints (protected by shared secret in handler)
	v1.POST("/internal/chatbot/refresh-catalog", s.chatbotHandler.RefreshCatalog)

	// Cart routes (protected)
	cartGroup := v1.Group("/cart", s.JWTAuth(s.authService.IsTokenBlacklisted))
	cartGroup.GET("", s.cartHandler.GetCart)
	cartGroup.POST("/items", s.cartHandler.AddItem)
	cartGroup.PATCH("/items/:id", s.cartHandler.UpdateItem)
	cartGroup.DELETE("/items/:id", s.cartHandler.RemoveItem)

	// Product routes (public — slug-based for SEO)
	productGroup := v1.Group("/products")
	productGroup.GET("", s.productHandler.ListProducts)
	productGroup.GET("/:slug", s.productHandler.GetProduct)
	productGroup.GET("/:slug/related", s.productHandler.ListRelatedProducts)
	productGroup.GET("/:slug/reviews", s.productHandler.ListProductReviews)

	orderGroup := v1.Group("/orders", s.JWTAuth(s.authService.IsTokenBlacklisted))
	orderGroup.POST("", s.orderHandler.CreateOrder)
	orderGroup.GET("", s.orderHandler.ListOrders)
	orderGroup.GET("/:id", s.orderHandler.GetOrder)
	orderGroup.POST("/:id/cancel", s.orderHandler.CancelOrder)

	// TODO: Vendor product routes (protected, UUID-based)
	// vendorProductGroup := v1.Group("/vendor/products", s.JWTAuth(...))
	// vendorProductGroup.PUT("/:id", s.productHandler.UpdateProduct)
	// vendorProductGroup.DELETE("/:id", s.productHandler.DeleteProduct)

	// Brand routes (public)
	brandGroup := v1.Group("/brands")
	brandGroup.GET("", s.brandHandler.ListBrands)
	brandGroup.GET("/options", s.brandHandler.ListOptions)

	// Category routes (public)
	categoryGroup := v1.Group("/categories")
	categoryGroup.GET("", s.categoryHandler.ListCategories)
	categoryGroup.GET("/options", s.categoryHandler.ListOptions)

	// Skin type & concern lookup routes (public)
	v1.GET("/skin-types", s.skintypeHandler.ListSkinTypes)
	v1.GET("/skin-concerns", s.skintypeHandler.ListSkinConcerns)

	// Wishlist route (public — IDs are client-supplied)
	v1.GET("/wishlist", s.cartHandler.GetWishlist)

	// Address routes (public)
	addressGroup := v1.Group("/addresses")
	addressGroup.GET("/provinces", s.addressHandler.ListProvinces)
	addressGroup.GET("/provinces/:id/districts", s.addressHandler.ListDistrictsByProvince)
	addressGroup.GET("/districts/:id/wards", s.addressHandler.ListWardsByDistrict)
}

func (s *Server) healthCheck(c *echo.Context) error {
	ctx := c.Request().Context()

	sqlDB, err := s.db.DB()
	if err != nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{
			"status":   "unhealthy",
			"database": err.Error(),
		})
	}
	if err := sqlDB.PingContext(ctx); err != nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{
			"status":   "unhealthy",
			"database": err.Error(),
		})
	}

	if err := s.rdb.Ping(ctx).Err(); err != nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{
			"status": "unhealthy",
			"redis":  err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"status": "healthy",
	})
}
