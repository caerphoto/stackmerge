define([
    'backbone',
    'models/m.image'
], function (
    Backbone,
    ImageModel
) {
    var ImagesCollection = Backbone.Collection.extend({
        model: ImageModel
    });

    return ImagesCollection;
});
