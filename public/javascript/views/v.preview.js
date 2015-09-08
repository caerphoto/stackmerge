define([
    'backbone',
    'underscore',
], function (
    Backbone,
    _
) {
    var PreviewView = Backbone.View.extend({
        el: '.preview.pane',
        events: {
            'click .refresh': 'render',
            'click .cancel': 'cancelProcessing'
        },
        initialize: function (options) {
            this.images = options.images;
            this.canvas = this.$('canvas').get(0);
            this.listenTo(
                this.images,
                'imagesLoaded remove change:visible',
                this.render
            );
            this.listenTo(this.images, 'imagesLoaded', this.setCanvasSize);
            this.progressBar = this.$('.working-overlay progress').get(0);
            this.listenTo(this.images, 'progress', this.updateProgress);

            window.addEventListener('resize', _.debounce(this.recenterCanvas, 60).bind(this));
        },
        setCanvasSize: function () {
            var firstImage = this.images.getVisible()[0].get('image');

            // Setting canvas.width sets the *logical* canvas width, not it's
            // visual width, which is set with canvas.style.width.
            this.canvas.width = firstImage.naturalWidth;
            this.canvas.height = firstImage.naturalHeight;

            this.recenterCanvas();
        },
        recenterCanvas: function () {
            var scroller = this.el.querySelector('.preview-scroller');
            var paneSize = {
                width: scroller.clientWidth,
                height: scroller.clientHeight
            };

            if (this.canvas.width < paneSize.width) {
                this.canvas.style.marginLeft =
                    ((paneSize.width - this.canvas.width) / 2) + 'px';
            } else {
                this.canvas.style.marginLeft = 0;
            }

            if (this.canvas.height < paneSize.height) {
                this.canvas.style.marginTop =
                    ((paneSize.height - this.canvas.height) / 2) + 'px';
            } else {
                this.canvas.style.marginTop = 0;
            }


        },
        render: function () {
            var outputCtx = this.canvas.getContext('2d');
            var visibleImages;
            var firstImage;

            visibleImages = this.images.getVisible();
            this.$el.toggleClass('has-images', visibleImages.length > 0);
            if (this.images.length === 0 && visibleImages.length === 0) {
                return this;
            }

            firstImage = visibleImages[0].get('image');

            if (!firstImage) {
                return this;
            }

            this.$el.addClass('working');
            this.progressBar.value = 0;

            console.time('generate combined image');
            this.images.generateCombinedImageData(function (data) {
                console.timeEnd('generate combined image');
                this.$el.removeClass('working');
                outputCtx.putImageData(data, 0, 0);
            }.bind(this));

            return this;
        },
        updateProgress: function (reset) {
            var progress;
            if (reset) {
                progress = 0;
            } else {
                progress = parseInt(this.progressBar.value, 10) + 1;
            }
            this.progressBar.value = progress;
        },
        cancelProcessing: function () {
            this.$el.removeClass('working');
            this.images.terminateWorkers();
        }
    });

    return PreviewView;
});
