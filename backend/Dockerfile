# Stage 1: Build the application
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Create the runtime image
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/hotelbooking-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENV MONGODB_URI=mongodb://mongodb:27017/hotelbooking
ENTRYPOINT ["java", "-jar", "app.jar"]
