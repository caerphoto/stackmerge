define([
    'models/m.base'
], function (
    BaseModel
) {
    var ImageModel = BaseModel.extend({
        defaults: {
            name: 'unnamed image',
            id: '',
            visible: true,
            thumbnailURL: '',
            imageData: null,
            offset: { x: 0, y: 0 },
            hasMask: false,
            maskProgress: 0
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
                this.loader.terminate();
            }.bind(this);
            image.src = message.data;
        },

        maskGenerated: function (mask, fnDone) {
            var imageData = this.get('imageData');
            imageData.data.set(new Uint8ClampedArray(mask));
            this.set('hasMask', true);
            fnDone();
        },
        generateFocusMask: function (numImages, fnDone) {
            var imageData = this.get('imageData');
            if (!imageData) {
                throw new Error('Unable to create focus mask before image data is ready.');
            }

            this.set('maskProgress', 0);
            this.maskWorker = new Worker('/assets/javascript/workers/focus_mask.js');
            this.maskWorker.onmessage = function (message) {
                if (message.data) {
                    this.maskGenerated(message.data, fnDone);
                    this.maskWorker = null;
                } else {
                    this.increment('maskProgress');
                }
            }.bind(this);
            this.maskWorker.postMessage(imageData.data.buffer.slice(0));
            this.maskWorker.postMessage({
                imageWidth: imageData.width,
                numImages: numImages
            });
        }
    });

    return ImageModel;
});
