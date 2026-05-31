-- Setup databases for Epicor Integration and QC Scheduler
USE master;
GO

-- Drop databases if they exist
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'QCScheduler')
BEGIN
    ALTER DATABASE QCScheduler SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE QCScheduler;
END
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'EpicorERP')
BEGIN
    ALTER DATABASE EpicorERP SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE EpicorERP;
END
GO

-- Create Databases
CREATE DATABASE EpicorERP;
CREATE DATABASE QCScheduler;
GO

-- 1. Create Epicor ERP Database Structure
USE EpicorERP;
GO

CREATE TABLE JobHead (
    JobNum VARCHAR(50) PRIMARY KEY,
    PartNum VARCHAR(50) NOT NULL,
    PartDescription VARCHAR(255) NOT NULL,
    ProdQty DECIMAL(18, 2) NOT NULL,
    QtyCompleted DECIMAL(18, 2) NOT NULL,
    DueDate DATETIME NOT NULL,
    JobPriority VARCHAR(20) NOT NULL
);

CREATE TABLE JobOper (
    JobNum VARCHAR(50) NOT NULL,
    AssemblySeq INT NOT NULL,
    OprSeq INT NOT NULL,
    OpCode VARCHAR(20) NOT NULL,
    OpDesc VARCHAR(100) NOT NULL,
    OpComplete BIT NOT NULL DEFAULT 0,
    WCCode VARCHAR(20) NOT NULL,
    PRIMARY KEY (JobNum, AssemblySeq, OprSeq),
    FOREIGN KEY (JobNum) REFERENCES JobHead(JobNum) ON DELETE CASCADE
);
GO

-- Seed Epicor ERP Database
INSERT INTO JobHead (JobNum, PartNum, PartDescription, ProdQty, QtyCompleted, DueDate, JobPriority) VALUES
('JOB1001', 'PART-7789', 'Aerospace Machined Bracket', 100.00, 0.00, DATEADD(day, 2, GETDATE()), 'High'),
('JOB1002', 'PART-8890', 'Cast Iron Flange', 50.00, 0.00, DATEADD(day, -1, GETDATE()), 'Critical'),
('JOB1003', 'PART-1122', 'Stainless Steel Bolt Set', 500.00, 500.00, DATEADD(day, 5, GETDATE()), 'Normal'),
('JOB1004', 'PART-5544', 'Electronic Wiring Harness', 250.00, 0.00, DATEADD(day, 3, GETDATE()), 'Low'),
('JOB1005', 'PART-3344', 'Rubber Gaskets', 1000.00, 0.00, DATEADD(day, 1, GETDATE()), 'Normal'),
('JOB1006', 'PART-9911', 'Hydraulic Pump Valve', 12.00, 0.00, DATEADD(day, 4, GETDATE()), 'Critical');

INSERT INTO JobOper (JobNum, AssemblySeq, OprSeq, OpCode, OpDesc, OpComplete, WCCode) VALUES
('JOB1001', 0, 10, 'MACH', 'Milling Operation', 1, 'MACH'),
('JOB1001', 0, 20, 'QC', 'Incoming Quality Inspection', 0, 'QC'),
('JOB1002', 0, 10, 'CAST', 'Casting Deburr', 1, 'MACH'),
('JOB1002', 0, 20, 'QC', 'Incoming QC Inspection', 0, 'QC'),
('JOB1003', 0, 10, 'QC', 'Incoming Inspection', 1, 'QC'), -- Already completed operation
('JOB1004', 0, 10, 'QC', 'Visual Cable Inspection', 0, 'QC'),
('JOB1005', 0, 15, 'QC', 'Dimension QC Check', 0, 'QC'),
('JOB1006', 0, 30, 'QC', 'Pressure Test Inspection', 0, 'QC');
GO

-- 2. Create QC Scheduler Database Structure
USE QCScheduler;
GO

CREATE TABLE QCInspectors (
    InspectorId INT IDENTITY(1,1) PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Active BIT NOT NULL DEFAULT 1,
    Shift VARCHAR(50) NOT NULL,
    SkillLevel VARCHAR(50) NOT NULL
);

CREATE TABLE QCWorkCenters (
    WorkCenterId INT IDENTITY(1,1) PRIMARY KEY,
    WorkCenterCode VARCHAR(20) NOT NULL UNIQUE,
    Description VARCHAR(100) NOT NULL,
    Active BIT NOT NULL DEFAULT 1
);

CREATE TABLE QCJobs (
    QCJobId INT IDENTITY(1,1) PRIMARY KEY,
    EpicorJobNum VARCHAR(50) NOT NULL,
    AssemblySeq INT NOT NULL,
    OperationSeq INT NOT NULL,
    CurrentColumn VARCHAR(50) NOT NULL, -- 'New Incoming', 'Assigned', 'In Inspection', 'Completed'
    Priority VARCHAR(20) NOT NULL, -- 'Critical', 'High', 'Normal', 'Low'
    InspectorId INT NULL,
    EstimatedHours DECIMAL(10, 2) NULL,
    ActualHours DECIMAL(10, 2) NULL,
    Notes NVARCHAR(MAX) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_QCJobs_QCInspectors FOREIGN KEY (InspectorId) REFERENCES QCInspectors(InspectorId) ON DELETE SET NULL
);

CREATE TABLE QCHistory (
    HistoryId INT IDENTITY(1,1) PRIMARY KEY,
    QCJobId INT NOT NULL,
    ActionType VARCHAR(50) NOT NULL, -- 'Created', 'Move', 'Assign', 'Priority', 'Note', 'Complete', 'Update'
    OldValue VARCHAR(MAX) NULL,
    NewValue VARCHAR(MAX) NULL,
    ChangedBy VARCHAR(50) NOT NULL,
    ChangeDate DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(50) NOT NULL -- 'Supervisor', 'Inspector'
);
GO

-- Seed QC Scheduler Database
INSERT INTO QCInspectors (FirstName, LastName, Email, Active, Shift, SkillLevel) VALUES
('John', 'Doe', 'john.doe@factory.com', 1, 'Day Shift', 'Level 3 (Senior)'),
('Jane', 'Smith', 'jane.smith@factory.com', 1, 'Night Shift', 'Level 2 (Mid)'),
('Bob', 'Johnson', 'bob.johnson@factory.com', 1, 'Day Shift', 'Level 1 (Junior)');

INSERT INTO QCWorkCenters (WorkCenterCode, Description, Active) VALUES
('QC', 'Quality Control Incoming Inspection', 1),
('MET', 'Metrology Lab', 1),
('NDT', 'Non-Destructive Testing Lab', 1);

-- Seed Users (PasswordHash for 'password' using a standard SHA-256 for demo purposes, or we will write hasher code in backend)
-- We will seed:
-- supervisor / password
-- inspector / password
-- Using SHA256 of 'password': '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
INSERT INTO Users (Username, PasswordHash, Role) VALUES
('supervisor', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Supervisor'),
('inspector', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Inspector');
GO
