FROM python:3.10-slim
WORKDIR /app
COPY download_script.py .  
RUN pip install requests
EXPOSE 80
ENTRYPOINT ["python", "download_script.py"]