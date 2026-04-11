-- Thêm cột phone và desiredCollectionDate vào CollectionRequest (cho DB đã tồn tại)
ALTER TABLE "CollectionRequest" ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE "CollectionRequest" ADD COLUMN IF NOT EXISTS "desiredCollectionDate" TIMESTAMP(3);
