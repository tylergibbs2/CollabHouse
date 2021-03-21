FROM python:3.8

COPY requirements.txt /app/requirements.txt
WORKDIR /app
RUN pip install -r requirements.txt
COPY . /app

CMD exec hypercorn --bind :$PORT collabhouse.app:app