"use strict";
module.exports = function(db, DataTypes) {
    return db.define("Menu", {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        breakfast: {
            type: DataTypes.ARRAY(DataTypes.STRING)
        },
        lunch: {
            type: DataTypes.ARRAY(DataTypes.STRING)
        },
        dinner: {
            type: DataTypes.ARRAY(DataTypes.STRING)
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });
};
