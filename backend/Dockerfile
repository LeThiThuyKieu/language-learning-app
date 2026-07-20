# ========= Build Stage =========
FROM maven:3.9.8-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom trước để tận dụng cache
COPY pom.xml .

RUN mvn dependency:go-offline

# Copy source
COPY src ./src

# Build project
RUN mvn clean package -DskipTests


# ========= Run Stage =========
FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY --from=builder /app/target/language-learning-app-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]