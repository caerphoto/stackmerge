define([
    'backbone'
], function (
    Backbone
) {
    var ImageModel = Backbone.Model.extend({
        defaults: {
            name: 'unnamed image',
            id: '',
            visible: true,
            image: null,
            imageData: null,
            offset: { x: 0, y: 0 }
        },
        initialize: function (attributes) {
            this.on('change:image', this.generateImageData);
            this.readFileData(attributes.file);
        },
        readFileData: function (file) {
            var url;
            var image;
            if (!file) {
                this.set('image', null);
                return;
            }

            url = URL.createObjectURL(file);
            image = document.createElement('img');
            image.onload = function () {
                this.set('image', image);
                URL.revokeObjectURL(url);
            }.bind(this);
            image.src = url;
        },
        generateImageData: function (model, image) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');

            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            this.set('imageData', ctx.getImageData(0, 0, image.width, image.height));
        }
    });

    return ImageModel;
});
