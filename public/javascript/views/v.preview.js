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
            this.model = options.previewModel;

            this.elPreviewImage = this.$('.preview-image').get(0);
            this.listenTo(
                this.images,
                'imagesLoaded remove reset change:visible',
                this.render
            );
            this.listenTo(this.model, 'change:blendingMode', this.render);
            this.listenTo(this.model, 'change:size', this.setPreviewSize);
            this.listenTo(this.model, 'change:progress', this.updateProgress);

            this.progressBar = this.$('.working-overlay progress').get(0);
            this.elCancel = this.$('button.cancel').get(0);
            this.$timing = this.$el.parent().find('.timing span');

            window.addEventListener('resize', _.debounce(this.recenterPreview, 60).bind(this));
        },
        setPreviewSize: function () {
            var size = this.model.get('size');

            this.previewSize.width = size.width;
            this.previewSize.height = size.height;

            // Setting <canvas>.width sets the *logical* canvas width, not it's
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
            // The +2 is to account for the canvas's 1px border
            var computedHeight = zoomToFit ?
                this.elPreviewImage.offsetHeight :
                this.previewSize.height + 2;
            var computedWidth = zoomToFit ?
                this.elPreviewImage.offsetWidth :
                this.previewSize.width + 2;

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
            var timingStart;
            var performance = window.performance;

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
            this.elCancel.focus();
            this.progressBar.value = 0;

            timingStart = performance && performance.now() || Date.now();
            this.images.generateCombinedImageData(true, function (data) {
                var timingEnd = performance && performance.now() || Date.now();
                var timing = ((timingEnd - timingStart) / 1000).toFixed(2);
                outputCtx.putImageData(data, 0, 0);
                this.$el.removeClass('working');
                this.$timing.text(timing);
            }.bind(this));

            return this;
        },
        updateProgress: function (model, progress) {
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
