npm install
npm run dev

# Update S3 Code
aws s3 sync ./dist s3://cloudpdf-app/ --delete

# Clear CloudFront Cache
aws cloudfront create-invalidation \
--distribution-id E1NQ0XB79BWFH0 \
--paths "/*"

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 740831361169.dkr.ecr.us-east-1.amazonaws.com
docker buildx build --platform linux/amd64 --output=type=docker -t cloudpdf-processor .
docker tag cloudpdf-processor:latest 740831361169.dkr.ecr.us-east-1.amazonaws.com/cloudpdf-processor:latest
docker push 740831361169.dkr.ecr.us-east-1.amazonaws.com/cloudpdf-processor:latest

aws lambda invoke \
  --function-name cloudpdf-processor \
  --payload '{"action":"compress","file_key":"upload-1762600935163.pdf"}' \
  output.json
