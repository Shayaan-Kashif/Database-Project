-- +goose Up
CREATE VIEW User_Reviews_With_Lot AS
SELECT U.ID AS UserID, U.Name AS UserName, P.ID AS LotID, P.Name AS LotName, R.Title, R.Description, R.Score, R.Created_At, R.Updated_At
FROM Reviews R
JOIN Users U ON R.User_ID = U.ID
JOIN ParkingLots P ON R.Parking_Lot_ID = P.ID;

CREATE VIEW Top_Rated_Lot AS
SELECT P.ID, P.Name, ROUND(AVG(R.Score), 2)
FROM ParkingLots P
JOIN Reviews R ON P.ID = R.Parking_Lot_ID
GROUP BY P.ID, P.Name
HAVING AVG(R.Score) >= ALL (
    SELECT AVG(R2.Score)
    FROM Reviews R2
    JOIN ParkingLots P2 ON R2.Parking_Lot_ID = P2.ID
    WHERE P2.ID <> P.ID
    GROUP BY P2.ID
);

CREATE VIEW Avg_Parking_Time_Per_User AS
WITH MatchedSessions AS (
    SELECT Entry.User_ID, Entry.Parking_Lot_ID, Entry.Time AS Entry_Time,
    (
        SELECT MIN(Exit.Time)
        FROM Parking_Logs Exit
        WHERE Exit.User_ID = Entry.User_ID AND Exit.Parking_Lot_ID = Entry.Parking_Lot_ID AND Exit.Event_Type = 'exit' AND Exit.Time > Entry.Time
    ) AS Exit_Time
    FROM Parking_Logs Entry
    WHERE Entry.Event_Type = 'entry'
)
SELECT U.ID AS User_ID, U.Name AS User_Name, ROUND(AVG(EXTRACT(EPOCH FROM (M.Exit_Time - M.Entry_Time)) / 60), 2) AS Avg_Minutes_Parked
FROM Users U
JOIN MatchedSessions M ON U.ID = M.User_ID 
WHERE M.Exit_Time IS NOT NULL
GROUP BY U.ID
ORDER BY Avg_Minutes_Parked;

CREATE VIEW Count_Of_Logs_Per_User AS
SELECT U.ID AS UserID, U.Name AS UserName, COUNT(PL.ID) AS TotalEntries
FROM Users U 
FULL OUTER JOIN Parking_Logs PL ON U.ID = PL.User_ID
GROUP BY U.ID;

CREATE VIEW User_Highest_Lowest_Ratings AS
SELECT UserID, UserName, LotID, LotName, Title, Description, Score, Created_At, Updated_At, 'Highest' AS ReviewType
FROM User_Reviews_With_Lot URLV
WHERE (UserID, LotID) = (
    SELECT R.User_ID, R.Parking_Lot_ID
    FROM Reviews R
    WHERE R.User_ID = URLV.UserID
    ORDER BY R.Score DESC, R.Created_At DESC
    LIMIT 1
)
UNION ALL
SELECT UserID, UserName, LotID, LotName, Title, Description, Score, Created_At, Updated_At, 'Lowest' AS ReviewType
FROM User_Reviews_With_Lot URLV
WHERE (UserID, LotID) = (
    SELECT R.User_ID, R.Parking_Lot_ID
    FROM Reviews R
    WHERE R.User_ID = URLV.UserID
    ORDER BY R.Score ASC, R.Created_At DESC
    LIMIT 1
);

CREATE VIEW Average_Lot_Ratings AS
SELECT P.ID AS LotID, P.Name AS LotName, ROUND(AVG(R.Score), 2) AS AverageRating, COUNT(R.User_ID) AS TotalReviews
FROM ParkingLots P
LEFT JOIN Reviews R ON P.ID = R.Parking_Lot_ID
GROUP BY P.ID
ORDER BY AverageRating DESC;

CREATE VIEW Count_Of_Logs_Per_Lot AS
SELECT P.ID AS LotID, P.Name AS LotName, COUNT(PL.ID) AS TotalEntries
FROM Parking_Logs PL
JOIN ParkingLots P ON PL.Parking_Lot_ID = P.ID
GROUP BY P.ID;

CREATE VIEW Count_Of_Reviews_Per_User AS
SELECT U.ID AS UserID, U.Name AS UserName, COUNT(R.Parking_Lot_ID) AS TotalReviews
FROM Reviews R
JOIN Users U ON R.USER_ID = U.ID
GROUP BY U.ID;

CREATE VIEW Count_Of_Review_Per_Lot AS
SELECT P.ID AS LotID, P.Name AS LotName, COUNT(R.User_ID) AS TotalReviews
FROM Reviews R
JOIN ParkingLots P ON R.Parking_Lot_ID = P.ID
GROUP BY P.ID;

CREATE VIEW Full_Parking_Lots AS 
SELECT ID, Name, Slots, OccupiedSlots
FROM ParkingLots
WHERE OccupiedSlots = Slots;

-- +goose Down
DROP VIEW User_Reviews_With_Lot, Top_Rated_Lot, Avg_Parking_Time_Per_User, Count_Of_Logs_Per_User, User_Highest_Lowest_Ratings, Average_Lot_Ratings, Count_Of_Logs_Per_Lot, Count_Of_Reviews_Per_User, Count_Of_Review_Per_Lot, Full_Parking_Lots;