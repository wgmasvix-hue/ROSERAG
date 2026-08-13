# ═══════════════════════════════════════════════════════════════════
#  RoseRAG — RASA Server Image
#  Packages the trained model and serves the REST/socket.io API.
# ═══════════════════════════════════════════════════════════════════
FROM rasa/rasa:3.6.20-full

WORKDIR /app

# Copy project files
COPY domain.yml config.yml credentials.yml endpoints.yml ./
COPY data/ ./data/

# Pre-train model at image-build time (optional; can mount a model dir)
# RUN rasa train --out models/

USER root
RUN chown -R 1001:1001 /app
USER 1001

EXPOSE 5005

CMD ["run", \
     "--enable-api", \
     "--cors", "*", \
     "--debug", \
     "--endpoints", "endpoints.yml", \
     "--credentials", "credentials.yml"]
