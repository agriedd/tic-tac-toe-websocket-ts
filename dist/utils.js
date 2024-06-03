"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUtils = void 0;
var useUtils = function () {
    var stringify = function (key, data) {
        return JSON.stringify({
            key: key,
            data: data
        });
    };
    return {
        stringify: stringify,
    };
};
exports.useUtils = useUtils;
