# Testing & QA (Draft)

## Goals
- Unit tests for crypto and core utilities.
- Integration tests for upload → encrypt → store.
- Contract tests for event emission & invariants.

## Python (backend)
```bash
cd backend
pip install -r requirements-dev.txt
pytest -q --maxfail=1 --disable-warnings
```

## Contracts (Hardhat)
```bash
cd blockchain
npm ci
npm test
```

## Suggested Tools
- `pytest`, `pytest-cov` for coverage
- `ruff`, `black`, `mypy` for code quality
- Hardhat + Chai for Solidity unit tests
- (Optional) Fuzzing later with Echidna/Foundry
