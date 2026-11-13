FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src src
RUN mvn -B package
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S aurum && adduser -S aurum -G aurum && mkdir /uploads && chown aurum:aurum /uploads
WORKDIR /app
COPY --from=build /build/target/aurum-api-1.0.0.jar app.jar
USER aurum
ENV UPLOAD_DIR=/uploads
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
