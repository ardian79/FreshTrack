DROP TABLE IF EXISTS pengiriman CASCADE;
DROP TABLE IF EXISTS batch CASCADE;
DROP TABLE IF EXISTS panen CASCADE;
DROP TABLE IF EXISTS komoditas CASCADE;


CREATE TABLE komoditas (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(50) UNIQUE NOT NULL,
    umur_simpan_hari INT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE panen (
    id SERIAL PRIMARY KEY,
    komoditas_id INT NOT NULL REFERENCES komoditas(id) ON DELETE CASCADE,
    lahan VARCHAR(50) NOT NULL,
    berat_kg DOUBLE PRECISION NOT NULL,
    tanggal_panen DATE NOT NULL
);

CREATE TABLE batch (
    id SERIAL PRIMARY KEY,
    panen_id INT NOT NULL UNIQUE REFERENCES panen(id) ON DELETE CASCADE,
    sisa_umur_hari INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    sudah_dikirim BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE pengiriman (
    id SERIAL PRIMARY KEY,
    batch_id INT NOT NULL REFERENCES batch(id) ON DELETE CASCADE,
    tanggal_kirim DATE NOT NULL,
    tujuan VARCHAR(100) NOT NULL,
    status_kirim VARCHAR(30) NOT NULL
);

INSERT INTO komoditas (nama, umur_simpan_hari, is_deleted) VALUES
('Bayam', 3, FALSE),
('Kangkung', 3, FALSE),
('Stroberi', 4, FALSE),
('Jagung Manis', 5, FALSE),
('Pisang', 6, FALSE),
('Tomat', 7, FALSE),
('Cabai', 10, FALSE);
