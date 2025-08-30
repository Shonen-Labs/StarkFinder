from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.api.routes import app

client = TestClient(app)


class TestDeployedContractsEndpoint:
    def setup_method(self):
        self.now = datetime.now()
        self.sample_contracts = [
            {
                "id": 1,
                "contract_name": "TestToken",
                "contract_address": "0x1234567890abcdef1234567890abcdef12345678",
                "contract_metadata": {"version": "1.0", "type": "ERC20"},
                "deployed_at": (self.now - timedelta(days=1)).isoformat(),
            },
            {
                "id": 2,
                "contract_name": "TestNFT",
                "contract_address": "0xabcdef1234567890abcdef1234567890abcdef12",
                "contract_metadata": {"version": "2.0", "type": "ERC721"},
                "deployed_at": (self.now - timedelta(hours=6)).isoformat(),
            },
        ]

    def test_valid_request_with_deployed_contracts(self):
        with patch("app.api.routes.get_db") as mock_get_db:
            mock_db = MagicMock()
            mock_get_db.return_value = mock_db

            mock_query = MagicMock()
            mock_db.query.return_value = mock_query
            mock_query.all.return_value = self.sample_contracts

            response = client.get("/deployed_contracts")

            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert data[0]["contract_name"] == "TestToken"
            assert data[1]["contract_name"] == "TestNFT"

    def test_user_with_no_deployed_contracts(self):
        with patch("app.api.routes.get_db") as mock_get_db:
            mock_db = MagicMock()
            mock_get_db.return_value = mock_db

            mock_query = MagicMock()
            mock_db.query.return_value = mock_query
            mock_query.all.return_value = []

            response = client.get("/deployed_contracts")

            assert response.status_code == 200
            data = response.json()
            assert data == []

    def test_unauthorized_request(self):
        with patch("app.api.routes.get_db") as mock_get_db:
            mock_db = MagicMock()
            mock_get_db.return_value = mock_db

            mock_query = MagicMock()
            mock_db.query.return_value = mock_query
            mock_query.all.return_value = self.sample_contracts

            response = client.get("/deployed_contracts")

            assert response.status_code == 200
            mock_get_db.assert_called_once()

    def test_response_data_structure(self):
        with patch("app.api.routes.get_db") as mock_get_db:
            mock_db = MagicMock()
            mock_get_db.return_value = mock_db

            mock_query = MagicMock()
            mock_db.query.return_value = mock_query
            mock_query.all.return_value = [self.sample_contracts[0]]

            response = client.get("/deployed_contracts")

            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1

            contract = data[0]
            assert "id" in contract
            assert "contract_name" in contract
            assert "contract_address" in contract
            assert "contract_metadata" in contract
            assert "deployed_at" in contract

    def test_database_error_handling(self):
        with patch("app.api.routes.get_db") as mock_get_db:
            mock_db = MagicMock()
            mock_get_db.return_value = mock_db

            mock_query = MagicMock()
            mock_db.query.return_value = mock_query
            mock_query.all.side_effect = Exception("Database error")

            response = client.get("/deployed_contracts")

            assert response.status_code == 500
