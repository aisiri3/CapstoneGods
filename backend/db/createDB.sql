-- Use the capstoneDB database
CREATE DATABASE IF NOT EXISTS capstoneDB;
USE capstoneDB;

-- Create users table
CREATE TABLE IF NOT EXISTS Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(100) NOT NULL
);

-- Create evaluation entries table
CREATE TABLE IF NOT EXISTS evaluation_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prompt TEXT NOT NULL,
    sampleResponse TEXT NOT NULL,
    actualResponse TEXT NOT NULL,
    responseTime INT NOT NULL,
    similarityScore DECIMAL(5,2) NOT NULL
);

-- Create the persona table with an ID and a string input
CREATE TABLE personas (
    persona_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    persona_description TEXT
);

-- Add the persona_id column to the evaluation_entries table
ALTER TABLE evaluation_entries
ADD COLUMN persona_id INT;

-- Add the foreign key constraint to link evaluation_entries with personas
ALTER TABLE evaluation_entries
ADD CONSTRAINT fk_persona_id
FOREIGN KEY (persona_id) REFERENCES personas(persona_id)
ON DELETE SET NULL;

-- Insert a persona with both name and description
INSERT INTO personas (name, persona_description) 
VALUES 
("Language Learning Assistant", 
 "You are a language learning assistant helping English speakers to learn and improve their English. "
 "You provide explanations, examples, and suggestions to help users speak and understand English better. "
 "You are friendly, patient, and encouraging in your responses. Keep your responses very short and sweet and concise. Keep to maximum of 3 lines.");




INSERT INTO personas (name, persona_description) 
VALUES 
("Casual Assistant", 
 "This is a test"
 "You are a language learning assistant helping English speakers to learn and improve their English. "
 "You provide explanations, examples, and suggestions to help users speak and understand English better. "
 "You are friendly, patient, and encouraging in your responses. Keep your responses very short and sweet and concise. Keep to maximum of 3 lines.");

SELECT * FROM personas;