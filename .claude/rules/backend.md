---
paths:
  - "backend/**/*.py"
---

# Backend Rules (FastAPI / Python)

- Tests use pytest: `cd backend && ../.venv/bin/pytest tests/ -v`
- Run unit tests targeted: `pytest tests/test_xxx.py -v`
- Consolidate fixtures in conftest.py
- Use Pydantic v2 models (models.py)
- DB models use SQLAlchemy (db_models.py)
- Consolidate CRUD operations in crud.py
- Business logic goes in the services/ directory
- External API calls go in the clients/ directory
- Keep the OpenAPI spec (openapi.yaml) consistent with the implementation
