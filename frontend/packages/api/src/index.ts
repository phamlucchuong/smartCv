export * from './axios-instance';

// Auth (web-candidate static spec — well-named hooks)
export * from './generated/auth/auth';
export * from './generated/users/users';

// User service — candidate, wishlist, company controllers
export * from './generated/user/candidate-controller/candidate-controller';
export * from './generated/user/wishlist-controller/wishlist-controller';
export * from './generated/user/company-controller/company-controller';

// Job service
export * from './generated/job/job-controller/job-controller';
export * from './generated/job/home-controller/home-controller';

// Application service
export * from './generated/application/application-controller/application-controller';
export * from './generated/application/assessment-controller/assessment-controller';

// AI service
export * from './generated/ai/analysis/analysis';
export * from './generated/ai/ai-admin/ai-admin';

// Models
export * from './generated/model';
