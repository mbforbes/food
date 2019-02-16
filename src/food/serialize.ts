/// <reference path="constants.ts" />

function serialize(week: Week, path: string, success: () => void): void {
    // NOTE: unsafe
    $.ajax(path, {
        type: 'PUT',
        data: JSON.stringify(week, null, 4),
        success: function (response) {
            console.log('Successfully wrote week to ' + path);
            success();
        }
    })
}
