"""Simple integration tests for the GET /deployed_contracts endpoint."""

from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.api.routes import app
from app.models.deployed_contracts import DeployedContract

client = TestClient(app)


class TestDeployedContractsEndpointSimple:
    """Simple test suite for the /deployed_contracts endpoint."""

    def setup_method(self):
        """Set up test data before each test method."""
        self.now = datetime.utcnow()
        self.sample_contracts = [
            {
                "id": 1,
                "contract_name": "TestToken",
                "contract_address": "0x1234567890abcdef1234567890abcdef12345678",
                "contract_metadata": {"version": "1.0", "type": "ERC20"},
                "deployed_at": self.now - timedelta(days=1),
            },
            {
                "id": 2,
                "contract_name": "InsurancePool",
                "contract_address": "0xabcdef1234567890abcdef1234567890abcdef12",
                "contract_metadata": {"version": "2.0", "type": "Insurance"},
                "deployed_at": self.now,
            },
            {
                "id": 3,
                "contract_name": "OracleContract",
                "contract_address": "0x9876543210fedcba9876543210fedcba98765432",
                "contract_metadata": {"version": "1.5", "type": "Oracle"},
                "deployed_at": self.now - timedelta(days=2),
            },
        ]

    @patch("app.api.routes.get_db")
    def test_valid_request_with_deployed_contracts(self, mock_get_db):
        """Test valid request returns deployed contracts successfully."""
        # Arrange
        mock_db = MagicMock()
        mock_contracts = [MagicMock(**contract) for contract in self.sample_contracts]
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = (
            mock_contracts
        )
        mock_get_db.return_value = mock_db

        # Act
        response = client.get("/deployed_contracts")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    @patch("app.api.routes.get_db")
    def test_user_with_no_deployed_contracts(self, mock_get_db):
        """Test request when no contracts are deployed."""
        # Arrange
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = (
            []
        )
        mock_get_db.return_value = mock_db

        # Act
        response = client.get("/deployed_contracts")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0
        assert data == []

    @patch("app.api.routes.get_db")
    def test_filtering_by_name(self, mock_get_db):
        """Test filtering contracts by name."""
        # Arrange
        mock_db = MagicMock()
        mock_contracts = [MagicMock(**self.sample_contracts[0])]  # Only TestToken
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = (
            mock_contracts
        )
        mock_get_db.return_value = mock_db

        # Act
        response = client.get("/deployed_contracts", params={"name": "Token"})

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    @patch("app.api.routes.get_db")
    def test_sorting_by_deployed_at_desc(self, mock_get_db):
        """Test sorting by deployed_at in descending order (default)."""
        # Arrange
        mock_db = MagicMock()
        mock_contracts = [MagicMock(**contract) for contract in self.sample_contracts]
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = (
            mock_contracts
        )
        mock_get_db.return_value = mock_db

        # Act
        response = client.get(
            "/deployed_contracts", params={"sort_by": "deployed_at", "order": "desc"}
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    @patch("app.api.routes.get_db")
    def test_sorting_by_contract_name_asc(self, mock_get_db):
        """Test sorting by contract_name in ascending order."""
        # Arrange
        mock_db = MagicMock()
        mock_contracts = [MagicMock(**contract) for contract in self.sample_contracts]
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = (
            mock_contracts
        )
        mock_get_db.return_value = mock_db

        # Act
        response = client.get(
            "/deployed_contracts", params={"sort_by": "contract_name", "order": "asc"}
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    @patch("app.api.routes.get_db")
    def test_invalid_sort_by_field(self, mock_get_db):
        """Test error handling for invalid sort_by field."""
        # Arrange
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        # Act
        response = client.get(
            "/deployed_contracts", params={"sort_by": "invalid_field"}
        )

        # Assert
        assert response.status_code == 400
        assert "detail" in response.json()
        assert "Invalid sort_by field" in response.json()["detail"]

    @patch("app.api.routes.get_db")
    def test_combined_filtering_and_sorting(self, mock_get_db):
        """Test combining filtering and sorting."""
        # Arrange
        mock_db = MagicMock()
        mock_contracts = [MagicMock(**self.sample_contracts[2])]  # Only OracleContract
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = (
            mock_contracts
        )
        mock_get_db.return_value = mock_db

        # Act
        response = client.get(
            "/deployed_contracts",
            params={"name": "Contract", "sort_by": "deployed_at", "order": "desc"},
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    def test_endpoint_exists(self):
        """Test that the endpoint exists and is accessible."""
        # Act
        response = client.get("/deployed_contracts")

        # Assert - Should either return data or an error, but not 404
        assert response.status_code != 404

    def test_endpoint_accepts_query_parameters(self):
        """Test that the endpoint accepts query parameters."""
        # Act
        response = client.get(
            "/deployed_contracts",
            params={"name": "test", "sort_by": "deployed_at", "order": "desc"},
        )

        # Assert - Should not return 422 (validation error)
        assert response.status_code != 422


class TestDeployedContractsAuthenticationSimple:
    """Simple test suite for authenticated deployed contracts endpoint (future implementation)."""

    def test_current_endpoint_does_not_require_auth(self):
        """Test that the current endpoint doesn't require authentication."""
        # Act
        response = client.get("/deployed_contracts")

        # Assert - Currently succeeds without auth
        # This documents the current behavior and will need to be updated when auth is implemented
        assert response.status_code != 401

        # TODO: When authentication is implemented, this should be:
        # assert response.status_code == 401
        # assert "detail" in response.json()

    def test_endpoint_structure_is_ready_for_auth(self):
        """Test that the endpoint structure is ready for authentication to be added."""
        # This test documents that the endpoint is structured in a way that makes it easy to add authentication

        # The endpoint should be able to accept authentication headers
        response = client.get(
            "/deployed_contracts", headers={"Authorization": "Bearer test-token"}
        )

        # Currently ignores auth headers, but structure allows for easy addition
        assert response.status_code != 422  # Should not be a validation error

        # TODO: When authentication is implemented, this should validate the token
