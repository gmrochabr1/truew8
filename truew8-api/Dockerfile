# Estágio de Build (Pode ser feito no CI/CD ou localmente)
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Estágio de Execução (O que vai para a VPS)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Adiciona um utilizador não-root por segurança
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copia apenas o JAR final
COPY --from=build /app/target/*.jar app.jar

# Configurações de memória para containers (crucial para Java)
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]