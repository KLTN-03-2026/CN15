-- Thêm mã xác nhận và ghi chú nhận thưởng (đổi voucher / trồng cây, v.v.)
ALTER TABLE "RewardRedemption" ADD COLUMN "confirmationCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "RewardRedemption" ADD COLUMN "fulfillmentNote" TEXT;
