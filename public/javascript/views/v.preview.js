define([
    'backbone',
    'underscore',
    'models/m.preview'
], function (
    Backbone,
    _,
    PreviewModel
) {
    var PreviewView = Backbone.View.extend({
        el: 'canvas.preview',
        model: new PreviewModel(),
        initialize: function (options) {
            this.images = options.images;
            this.listenTo(this.images, 'imagesLoaded remove change:visible', this.render);
        },
        render: function () {
            var outputCtx = this.el.getContext('2d');
            var visibleImages;
            var firstImage;
            var alpha;

            if (this.images.length === 0) {
                return this;
            }

            visibleImages = this.images.filter(function (model) {
                return model.get('visible');
            });

            if (visibleImages.length === 0) {
                return this;
            }

            alpha = Math.floor(255 / visibleImages.length);

            firstImage = visibleImages[0].get('image');

            if (!firstImage) {
                return this;
            }

            this.el.width = firstImage.naturalWidth;
            this.el.height = firstImage.naturalHeight;

            outputCtx.clearRect(0, 0, this.el.width, this.el.height);
            _.forEach(visibleImages, function (model) {
                var canvas = model.get('canvas');
                var offset = model.get('offset');
                if (canvas && model.get('visible')) {
                    model.modifyAlpha(alpha);
                    outputCtx.drawImage(canvas, offset.x, offset.y);
                }
            });

            return this;
        }
    });

    return PreviewView;
});
