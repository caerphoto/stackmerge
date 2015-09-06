define([
    'backbone'
], function (
    Backbone
) {
    var PreviewModel = Backbone.Model.extend({
        defaults: {
            canvas: document.createElement('canvas')
        }
    });

    return PreviewModel;
});
