/// <reference path="constants.ts" />

function serialize(week: Week, path: string, next: () => {}): void {
    // NOTE: unsafe
    $.ajax(path, {
        type: 'PUT',
        data: JSON.stringify(week),
        success: function (response) {
            console.log('Successfully wrote week to ' + path);
            next();
        }
    })
}
