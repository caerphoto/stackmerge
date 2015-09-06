define([
    'backbone',
    'underscore',
    'models/m.image'
], function (
    Backbone,
    _,
    ImageModel
) {
    var ImagesCollection = Backbone.Collection.extend({
        model: ImageModel,
        addFromFiles: function (files) {
            _.each(files, function (file) {
                this.push({
                    name: file.name,
                    id: _.uniqueId('stackmerge_'),
                    file: file
                });
            }, this);
        }
    });

    return ImagesCollection;
});
