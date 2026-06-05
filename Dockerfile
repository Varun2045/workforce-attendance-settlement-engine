# Stage 1: Build the application from source
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Package the JAR and run
FROM amazoncorretto:17
WORKDIR /app
COPY --from=build /app/target/employee-system-backend-0.0.1-SNAPSHOT.jar /app/employee-system-backend.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "employee-system-backend.jar"]