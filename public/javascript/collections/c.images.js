/*global ImageData */
define([
    'backbone',
    'underscore',
    'quicksort',
    'models/m.image'
], function (
    Backbone,
    _,
    quicksort,
    ImageModel
) {
    var ImagesCollection = Backbone.Collection.extend({
        model: ImageModel,
        imagesToLoad: 0,
        initialize: function () {
            this.on('change:canvas', this.canvasReady);
        },
        canvasReady: function (model, canvas) {
            if (canvas) {
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
            this.imagesToLoad += files.length;

            _.forEach(files, function (file) {
                this.push({
                    name: file.name,
                    id: _.uniqueId('stackmerge_'),
                    file: file
                });
            }, this);
        },
        getVisibleImages: function (ready) {
            return this.filter(function (model) {
                return ready ?
                    model.get('visible') && model.get('canvas') !== null :
                    model.get('visible');
            });
        },
        getCombinedImageData: function () {
            var allData = _.map(this.getVisibleImages(true), function (model) {
                return model.get('imageData');
            });
            var allPixels = _.map(allData, function (data) {
                return data.data;
            });
            var combined = new Uint8ClampedArray(allPixels[0].length);

            var pixelByte;
            var numBytes = combined.length;

            var imageIndex;
            var numImages = allData.length;
            var r = new Uint8ClampedArray(numImages);
            var g = new Uint8ClampedArray(numImages);
            var b = new Uint8ClampedArray(numImages);
            var medianIndex = Math.floor(numImages / 2);

            if (!_.every(this.getVisibleImages(), function (model) {
                return model.get('canvas') !== null;
            })) {
                return null;
            }

            for (pixelByte = 0; pixelByte < numBytes; pixelByte += 4) {
                for (imageIndex = 0; imageIndex < numImages; imageIndex += 1) {
                    r[imageIndex] = allPixels[imageIndex][pixelByte];
                    g[imageIndex] = allPixels[imageIndex][pixelByte + 1];
                    b[imageIndex] = allPixels[imageIndex][pixelByte + 2];
                }

                combined[pixelByte] = quicksort(r)[medianIndex];
                combined[pixelByte + 1] = quicksort(g)[medianIndex];
                combined[pixelByte + 2] = quicksort(b)[medianIndex];
                combined[pixelByte + 3] = 255;
            }

            return new ImageData(
                combined,
                allData[0].width,
                allData[0].height
            );
        }
    });

    return ImagesCollection;
});
