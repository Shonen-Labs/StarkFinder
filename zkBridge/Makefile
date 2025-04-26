# Makefile to build and run the Helios container

# Variables
IMAGE_NAME = helios
TAG = latest
CONTAINER_NAME = zkbridge
DOCKERFILE = Dockerfile

# Build the Docker image
build:
	docker build -t $(IMAGE_NAME):$(TAG) -f $(DOCKERFILE) .

# Run the Docker container
run:
	docker run --name $(CONTAINER_NAME) -it $(IMAGE_NAME):$(TAG)

# Remove the Docker container
clean:
	docker rm -f $(CONTAINER_NAME)

# Remove the Docker image
clean-image:
	docker rmi $(IMAGE_NAME):$(TAG)

# Rebuild the Docker image and run the container
rebuild: clean clean-image build run