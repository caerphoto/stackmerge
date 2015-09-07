define([
    'backbone',
    'jquery',
    'mustache'
], function (
    Backbone,
    $,
    Mustache
) {
    var ImagesView = Backbone.View.extend({
        el: 'ol.image-stack',
        template: document.getElementById('template-stack-item').innerHTML,
        events: {
            'click .remove': 'removeImage',
            'change .toggle': 'toggleImageVisibility'
        },
        initialize: function (options) {
            this.images = options.images;
            this.listenTo(this.images, 'add remove', this.render);
            this.listenTo(this.images, 'change:image', this.updateImage);
        },
        render: function () {
            this.el.innerHTML = Mustache.render(
                this.template,
                { images: this.images.toJSON() }
            );

            return this;
        },
        updateImage: function (model, image) {
            var $caption = this.$('#thumb-' + model.id + ' figcaption');

            if (image) {
                $caption.before(image);
                $caption.closest('figure').removeClass('loading');
            } else {
                $caption.prev('img').remove();
                $caption.closest('figure').addClass('loading');
            }

        },

        toggleImageVisibility: function (evt) {
            var visible = evt.target.checked;
            var id = evt.target.getAttribute('data-id');
            var model = this.images.findWhere({ id: id });
            model.set('visible', visible);
            $(evt.target).closest('li').toggleClass('using', visible);
        },

        removeImage: function (evt) {
            var id = evt.target.getAttribute('data-id');
            this.images.remove(id);
        }
    });

    return ImagesView;
});
