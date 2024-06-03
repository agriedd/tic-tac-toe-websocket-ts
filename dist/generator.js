"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGeneratorBoard = void 0;
var useGeneratorBoard = function () {
    var cellValueCollection = ['o', 'x', null];
    var generateRandom = function () {
        var result = [];
        for (var i = 0; i < 9; i++) {
            var yIndex = i % 3;
            var xIndex = parseInt(String(i / 3));
            var value = cellValueCollection[Math.floor(Math.random() * cellValueCollection.length)];
            result.push({
                x: xIndex,
                y: yIndex,
                value: value,
                mark: false,
            });
        }
        return result;
    };
    var generateEmpty = function () {
        var result = [];
        for (var i = 0; i < 9; i++) {
            var yIndex = i % 3;
            var xIndex = parseInt(String(i / 3));
            var value = null;
            result.push({
                x: xIndex,
                y: yIndex,
                value: value,
                mark: false
            });
        }
        return result;
    };
    return {
        generateRandom: generateRandom,
        generateEmpty: generateEmpty,
    };
};
exports.useGeneratorBoard = useGeneratorBoard;
