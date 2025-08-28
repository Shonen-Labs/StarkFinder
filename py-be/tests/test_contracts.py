"""Tests for contract-related endpoints."""

import pytest
from datetime import datetime

def test_create_contract(client):
    """Test creating a new contract."""
    contract_data = {
        "name": "Test Contract",
        "address": "0x1234567890123456789012345678901234567890",
        "deployment_date": "2025-08-29T12:00:00Z"
    }
    response = client.post("/api/contracts", json=contract_data)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == contract_data["name"]
    assert data["address"] == contract_data["address"].lower()
    assert "id" in data

def test_create_contract_invalid_address(client):
    """Test creating a contract with invalid address format."""
    contract_data = {
        "name": "Test Contract",
        "address": "invalid_address",
        "deployment_date": "2025-08-29T12:00:00Z"
    }
    response = client.post("/api/contracts", json=contract_data)
    assert response.status_code == 422

def test_get_deployed_contracts(client):
    """Test retrieving deployed contracts with various filters."""
    # Create some test contracts
    contracts = [
        {
            "name": "ERC20 Token",
            "address": "0x1111111111111111111111111111111111111111",
            "deployment_date": "2025-08-28T10:00:00Z"
        },
        {
            "name": "NFT Contract",
            "address": "0x2222222222222222222222222222222222222222",
            "deployment_date": "2025-08-29T12:00:00Z"
        }
    ]
    for contract in contracts:
        response = client.post("/api/contracts", json=contract)
        assert response.status_code == 201

    # Test listing all contracts
    response = client.get("/api/deployed_contracts")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 2
    assert data["total"] == 2

    # Test filtering by name
    response = client.get("/api/deployed_contracts?name=Token")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["name"] == "ERC20 Token"

    # Test sorting
    response = client.get("/api/deployed_contracts?sort_by=deployment_date:desc")
    assert response.status_code == 200
    data = response.json()
    assert data["data"][0]["name"] == "NFT Contract"

    # Test pagination
    response = client.get("/api/deployed_contracts?limit=1&skip=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1

def test_invalid_sort_field(client):
    """Test sorting by invalid field."""
    response = client.get("/api/deployed_contracts?sort_by=invalid_field:desc")
    assert response.status_code == 400
    assert "Invalid sort field" in response.json()["detail"]

def test_rate_limiting(client):
    """Test rate limiting on endpoints."""
    # Test rate limiting on GET endpoint
    for _ in range(61):  # Exceed the 60/minute limit
        response = client.get("/api/deployed_contracts")
        if response.status_code == 429:  # If we hit the rate limit early
            break
    assert response.status_code == 429  # Too Many Requests

    # Test rate limiting on POST endpoint
    for i in range(11):  # Exceed the 10/minute limit
        contract_data = {
            "name": f"Test Contract {i}",
            "address": f"0x{i:040x}",  # Create unique addresses
            "deployment_date": "2025-08-29T12:00:00Z"
        }
        response = client.post("/api/contracts", json=contract_data)
        if response.status_code == 429:  # If we hit the rate limit early
            break
    assert response.status_code == 429  # Too Many Requests
