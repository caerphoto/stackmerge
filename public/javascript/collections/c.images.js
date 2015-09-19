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
        numImagesToLoad: 0,
        workerPaths: {
            focus: '/assets/javascript/workers/focus_processor.js',
            median: '/assets/javascript/workers/median_processor.js'
        },
        initialize: function (attrs, options) {
            this.previewModel = options.previewModel;

            this.on('change:imageData', this.imageDataReady);
            this.on('change:maskProgress', this.updateMaskProgress);
            this.working = false;
            this.worker = null;
        },

        imageDataReady: function (model, imageData) {
            if (imageData) {
                this.numImagesToLoad -= 1;
                this.previewModel.increment('progress', this.percentPerImage);
            }

            if (this.numImagesToLoad === 0) {
                this.previewModel.set('size', {
                    width: imageData.width,
                    height: imageData.height
                });
                setTimeout(function () {
                    this.trigger('imagesLoaded');
                }.bind(this), 50);
                this.previewModel.set('progress', false);
            }

            if (this.numImagesToLoad < 0) {
                throw new Error('numImagesToLoad became less than 0');
            }
        },
        addFromFiles: function (files) {
            this.numImagesToLoad += files.length;
            this.percentPerImage = 100 / this.numImagesToLoad;

            if (this.numImagesToLoad === 0) {
                return;
            }

            this.previewModel.set({
                processingMessage: 'Loading images',
                progress: 0
            });

            // Can't use files.forEach directly because it's not actually an
            // Array.
            _.forEach(files, function (file) {
                this.push({
                    name: file.name,
                    id: _.uniqueId('stackmerge_'),
                    file: file
                });
            }, this);
        },
        getVisible: function (onlyReady) {
            if (this.length === 0) {
                return [];
            }
            return this.filter(function (model) {
                return onlyReady ?
                    model.get('visible') && model.get('imageData') !== null :
                    model.get('visible');
            });
        },

        onWorkerMessage: function (buffer, fnDone) {
            var ctx;
            var imageData;

            if (buffer && buffer.byteLength) {
                ctx = document.createElement('canvas').getContext('2d');
                imageData = ctx.createImageData(
                    this.imageSize.width,
                    this.imageSize.height
                );
                imageData.data.set(new Uint8ClampedArray(buffer));

                fnDone(imageData);
            } else {
                // No buffer, so this is just a 'progress' message.
                this.previewModel.increment('progress');
            }
        },

        processImages: function (images, mergeMode, fnDone) {
            // Send a copy of each image's data to the worker, then send a
            // message to signal that processing should begin.

            this.worker = new Worker(this.workerPaths[mergeMode]);
            this.worker.onmessage = function (message) {
                this.onWorkerMessage(message.data, fnDone);
            }.bind(this);

            this.previewModel.set({
                progress: 0,
                processingMessage: 'Merging images'
            });

            images.forEach(function (imageData, index) {
                // Local slice() + transfer is faster than copy.
                var buffer = imageData.data.buffer.slice(0);

                try {
                    this.worker.postMessage(buffer, [buffer]);
                } catch (e) {
                    console.warn('Failed to create array buffers after',
                        index - 1, 'images, possibly due to memory restrictions:');
                    console.log(e);
                }

            }, this);

            this.worker.postMessage('start');
        },

        updateMaskProgress: function () {
            var meanProgress = this.reduce(function (sum, image) {
                return sum + image.get('maskProgress');
            }, 0) / this.length;

            this.previewModel.set('progress', meanProgress);
        },

        ensureFocusMasks: function (fnReady) {
            var imagesWithoutMasks = this.filter(function (image) {
                return !image.get('hasMask');
            });
            var imagesRemaining = imagesWithoutMasks.length;

            if (imagesRemaining === 0) {
                fnReady.call(this);
                return;
            }


            function maskReady() {
                imagesRemaining -= 1;
                if (imagesRemaining === 0) {
                    fnReady.call(this);
                }
            }

            this.previewModel.set({
                progress: 0,
                processingMessage: 'Generating focus masks'
            });

            imagesWithoutMasks.forEach(function (image) {
                image.generateFocusMask(imagesRemaining, maskReady.bind(this));
            }, this);
        },

        generateCombinedImageData: function (fnDone) {
            var visibleImages = this.getVisible(true).map(function (model) {
                return model.get('imageData');
            });
            var mergeMode = this.previewModel.get('mergeMode');

            if (!this.getVisible().every(function (model) {
                return model.get('imageData') !== null;
            })) {
                return null;
            }

            if (!_.isFunction(fnDone)) {
                return null;
            }

            this.terminateWorkers();

            this.working = true;
            this.imageSize = {
                width: visibleImages[0].width,
                height: visibleImages[0].height
            };

            if (mergeMode === 'focus') {
                this.ensureFocusMasks(function () {
                    this.processImages(visibleImages, mergeMode, fnDone);
                });
            } else {
                this.processImages(visibleImages, mergeMode, fnDone);
            }
        },
        terminateWorkers: function () {
            this.forEach(function (image) {
                if (image.maskWorker) {
                    image.maskWorker.terminate();
                }
            });
            if (this.worker) {
                this.worker.terminate();
            }
        }
    });

    return ImagesCollection;
});
