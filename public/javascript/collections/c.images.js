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
        imagesToLoad: 0,
        initialize: function () {
            this.on('change:imageData', this.imageLoaded);
        },
        imageLoaded: function (model, imageData) {
            if (imageData) {
                console.log('loaded data for', model.get('name'), this.imagesToLoad, 'remaining');
                this.imagesToLoad -= 1;
            }

            if (this.imagesToLoad === 0) {
                this.trigger('imagesLoaded');
            }

            if (this.imagesToLoad < 0) {
                throw new Error('imagesToLoad became less than 0');
            }
        },
        addFromFiles: function (files) {
            this.imagesToLoad = files.length;

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
