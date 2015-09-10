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
            thumbnailURL: '',
            imageData: null,
            offset: { x: 0, y: 0 }
        },
        THUMB_SIZE: 200,
        initialize: function (attributes) {
            this.loader = new Worker('/assets/javascript/workers/loader.js');
            this.loader.onmessage = this.imageLoaded.bind(this);
            this.loader.postMessage(attributes.file);
        },
        generateThumbnail: function (image) {
            var thumbCanvas = document.createElement('canvas');
            var thumbCtx = thumbCanvas.getContext('2d');

            var thumbWidth, thumbHeight;

            if (image.width > image.height) {
                // landscape orientation
                thumbWidth = this.THUMB_SIZE;
                thumbHeight = this.THUMB_SIZE *
                    (image.height / image.width);
            } else {
                thumbHeight = this.THUMB_SIZE;
                thumbWidth = this.THUMB_SIZE *
                    (image.width / image.height);
            }

            thumbCanvas.width = thumbWidth;
            thumbCanvas.height = thumbHeight;

            thumbCtx.drawImage(image, 0, 0, thumbWidth, thumbHeight);
            this.set('thumbnailURL', thumbCanvas.toDataURL());
        },
        generateImageData: function (image) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var imageData;

            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            imageData = ctx.getImageData(0, 0, image.width, image.height);
            this.generateThumbnail(image);
            this.set('imageData', imageData);
        },
        imageLoaded: function (message) {
            var image = document.createElement('img');
            image.onload = function () {
                this.generateImageData(image);
                URL.revokeObjectURL(message.data);
            }.bind(this);
            image.src = message.data;
        }
    });

    return ImageModel;
});
