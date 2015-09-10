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
            'click .cancel': 'cancelProcessing',
            'click #zoom-to-fit': 'toggleZoom'
        },
        previewSize: {
            width: 0,
            height: 0
        },
        initialize: function (options) {
            this.images = options.images;
            this.elPreviewImage = this.$('.preview-image').get(0);
            this.listenTo(
                this.images,
                'imagesLoaded remove change:visible',
                this.render
            );
            this.listenTo(this.images, 'imagesLoaded', this.setPreviewSize);
            this.progressBar = this.$('.working-overlay progress').get(0);
            this.listenTo(this.images, 'progress', this.updateProgress);

            window.addEventListener('resize', _.debounce(this.recenterPreview, 60).bind(this));
        },
        setPreviewSize: function () {
            var firstImage = this.images.getVisible()[0].get('imageData');

            this.previewSize.width = firstImage.width;
            this.previewSize.height = firstImage.height;

            // Setting canvas.width sets the *logical* canvas width, not it's
            // visual width, which is set with canvas.style.width.
            this.elPreviewImage.width = this.previewSize.width;
            this.elPreviewImage.height = this.previewSize.height;

            this.recenterPreview();
        },
        recenterPreview: function (zoomToFit) {
            var scroller = this.el.querySelector('.preview-scroller');
            var paneSize = {
                width: scroller.clientWidth,
                height: scroller.clientHeight
            };
            // The -2 is to account for the image's 1px borders
            var computedHeight = zoomToFit ?
                this.elPreviewImage.getBoundingClientRect().height + 2 :
                this.previewSize.height;
            var computedWidth = zoomToFit ?
                this.elPreviewImage.getBoundingClientRect().width + 2 :
                this.previewSize.width;

            if (zoomToFit || this.previewSize.width < paneSize.width) {
                this.elPreviewImage.style.marginLeft =
                    ((paneSize.width - computedWidth) / 2) + 'px';
            } else {
                this.elPreviewImage.style.marginLeft = 0;
            }

            if (zoomToFit || this.previewSize.height < paneSize.height) {
                this.elPreviewImage.style.marginTop =
                    ((paneSize.height - computedHeight) / 2) + 'px';
            } else {
                this.elPreviewImage.style.marginTop = 0;
            }


        },
        render: function () {
            var outputCtx = this.elPreviewImage.getContext('2d');
            var visibleImages;
            var firstImage;

            visibleImages = this.images.getVisible();
            this.$el.toggleClass('has-images', visibleImages.length > 0);
            if (this.images.length === 0 && visibleImages.length === 0) {
                return this;
            }

            firstImage = visibleImages[0].get('imageData');

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
        },
        toggleZoom: function (evt) {
            this.$el.toggleClass('zoom-to-fit', evt.target.checked);
            this.recenterPreview(evt.target.checked);
        }
    });

    return PreviewView;
});
