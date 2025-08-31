"""Test basic CRUD operations with direct imports."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import directly from modules
from app.models.base import Base
from app.models.user import User
from app.repositories.user_repository import UserRepository

# Test database setup
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a test database session."""
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def user_repository(db_session):
    """Create UserRepository instance."""
    return UserRepository(db_session)

@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "hashedpassword123",
        "full_name": "Test User",
        "bio": "Test user for CRUD operations",
        "is_active": True
    }

class TestCRUDOperations:
    """Test basic CRUD operations as requested in issue #456."""
    
    def test_create_user(self, user_repository, sample_user_data):
        """Test CREATE operation - Insert new user."""
        # CREATE
        user = user_repository.create(sample_user_data)
        
        # Assertions
        assert user.id is not None
        assert user.username == sample_user_data["username"]
        assert user.email == sample_user_data["email"]
        assert user.password == sample_user_data["password"]
        assert user.full_name == sample_user_data["full_name"]
        assert user.is_active == sample_user_data["is_active"]
    
    def test_read_user(self, user_repository, sample_user_data):
        """Test READ operation - Get user by ID."""
        # CREATE first
        created_user = user_repository.create(sample_user_data)
        
        # READ
        retrieved_user = user_repository.read(created_user.id)
        
        # Assertions
        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.username == sample_user_data["username"]
        assert retrieved_user.email == sample_user_data["email"]
    
    def test_update_user(self, user_repository, sample_user_data):
        """Test UPDATE operation - Update user by ID."""
        # CREATE first
        user = user_repository.create(sample_user_data)
        original_id = user.id
        
        # UPDATE
        update_data = {"username": "updated_user", "email": "updated@example.com", "full_name": "Updated User"}
        updated_user = user_repository.update(user.id, update_data)
        
        # Assertions
        assert updated_user is not None
        assert updated_user.id == original_id  # ID should not change
        assert updated_user.username == "updated_user"
        assert updated_user.email == "updated@example.com"
        assert updated_user.full_name == "Updated User"
        assert updated_user.password == sample_user_data["password"]  # Unchanged
    
    def test_delete_user(self, user_repository, sample_user_data):
        """Test DELETE operation - Remove user by ID."""
        # CREATE first
        user = user_repository.create(sample_user_data)
        user_id = user.id
        
        # DELETE
        deleted = user_repository.delete(user_id)
        
        # Assertions
        assert deleted is True
        
        # Verify deletion
        deleted_user = user_repository.read(user_id)
        assert deleted_user is None