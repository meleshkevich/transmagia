-- Migrate existing test book slug from Cyrillic to ASCII.
-- The book "Шум дождя" was inserted before the ASCII slug policy was established.
UPDATE books
SET slug = 'shum-dozhdya'
WHERE slug = 'шум-дождя';
