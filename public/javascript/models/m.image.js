define([
    'backbone'
], function (
    Backbone
) {
    var ImageModel = Backbone.Model.extend({
        defaults: {
            name: 'unnamed image',
            id: '',
            width: 0,
            height: 0,
            data: null
        }
    });

    return ImageModel;
});
