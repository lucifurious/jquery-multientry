/**
 * jquery.multientry.js
 * A plug-in to provide an entry widget for Yii/Bootstrap forms
 *
 * Requires jQuery Validate
 *
 * @author Jerry Ablan <jerryablan@gmail.com>
 */
;
(function($, window, document, undefined) {

	//**************************************************************************
	//* Plugin
	//**************************************************************************

	/**
	 * Begin the plug-in
	 * @param options
	 */
	$.fn.multientry = function(options) {

		//**************************************************************************
		//* Initialize
		//**************************************************************************

		options = $.extend({}, $.fn.multientry.options, options);
		options.replacementPattern = new RegExp(options.replacementTag, 'gi');

		//**************************************************************************
		//* Main
		//**************************************************************************

		return this.each(function() {
			/**
			 * Mini-me
			 * @type {*}
			 * @private
			 */
			var _model = $(this).data('model') || '';
			var _attribute = $(this).data('attribute') || $(this).attr('id');
			var _simpleName = _model ? _model + '[' + _attribute + ']' : _attribute.replace('-', '_');
			var _simpleId = _model ? _model + '_' + _attribute : _attribute;

			if (!options.model) {
				options.model = _model;
			}
			if (!options.attribute) {
				options.attribute = _attribute;
			}
			if (!options.name) {
				options.name = _simpleName;
			}
			if (!options.id) {
				options.id = _simpleId;
			}
			if (options.hidden) {
				$(this).addClass('hide');
			}

			var $_me = $(this);
			$_me.options = options;

			//	Create div
			var _divId = 'df-multientry-' + options.attribute;
			var _pif = '_' + _simpleId;
			var _columns = 12;

			//	form-group
			$('<div class="' + options.divClass + '" id="' + _pif + '" style=""></div>').appendTo($_me);
			var $_pif = $('div#' + _pif);

			$('<input type="hidden" name="' + _simpleName + '" id="' + _simpleId + '" />').appendTo($_pif);

			if (options.label) {
				$('<label for="" class="' + 'col-' + options.gridSize + '-' + options.labelSize + ' ' + options.labelClass + '">' + options.label +
					'</label>').appendTo($_pif);

				_columns -= options.labelSize;
			}
			else {
				options.labelSize = 0;
			}

			var _inputSizeClass = 'col-' + options.gridSize + '-' + ( options.inputSize || _columns );
			var _inputOffsetClass = 'col-' + options.gridSize + '-offset-' + options.labelSize;

			$('<div class="' + _inputSizeClass + '">' + '<ul class="nav nav-stacked form-control ' + options.ulClass + ' scroll-pane" id="' +
				options.attribute + '"></ul>' + '</div>' + '</div>').appendTo($_pif);

			$('<div class="' + options.divClass + '">' + '<div class="' + _inputOffsetClass + ' ' + _inputSizeClass + ' input-group">' +
				'	<span class="input-group-btn">' + '		<button class="' + options.buttonClass +
				'" type="button"><i class="fa fa-plus-square"></i>Add Header</button>' + '	</span>' +
				'	<input data-parent="ul#' + options.attribute + '" id="df-multientry-add-item-' + options.attribute + '" class="' +
				options.inputClass +
				'" type="text" placeholder="' + options.placeholder + '">' + '	</div>' + '</div>').appendTo($_me);

			$('<style>div#' + $(this).attr('id') + ' label.error { display: block; margin-top: 4px; padding-left:	0; }</style>').appendTo($_me);

			//	Finally, add data...
			$.each(options.items, function(index, item) {
				//				alert(index+':'+item);
				$('ul#' + options.attribute).append(options.itemTemplate.replace(options.replacementPattern, item));
			});

			if ($.fn.jScrollPane) {
				options._pane = $('.scroll-pane').jScrollPane({
					verticalGutter:   0,
					mouseWheelSpeed:  200,
					arrowButtonSpeed: 200,
					keyboardSpeed:    200,
					hideFocus:        true
				}).data('jsp');

				$('.scroll-pane-arrows').jScrollPane({
					showArrows:       false,
					horizontalGutter: 10
				});

				options._contentPane = options._pane.getContentPane()
			}
			else {
				options._contentPane = $('ul#' + options.attribute);
			}

			//**************************************************************************
			//* Local event handler
			//**************************************************************************

			//	Fix up items
			$('form' + (options.formId ? '#' + options.formId : '')).submit(function() {
				var _items = '';

				$('.multientry ul li').each(function(index, item) {
					_items += $.trim($(item).attr('id')) + ';';
				});

				$('input#' + options.id).val(_items);
				return true;
			});

			/**
			 * Add new item button handler
			 */
			$('button.add-new-item').on('click', function(e) {
				var $_item = $('input#df-multientry-add-item-' + options.attribute);
				var _itemValue = $.trim($_item.val());

				//	Ignore errors
				if (!_itemValue.length || $(this).prev('input.ps-validate-error').length) {
					return false;
				}

				if (!_itemValue.match(/^[A-Za-z0-9\-]+:\s[A-Za-z0-9\-]+$/)) {
					alert('Invalid header format or content.');
					return false;
				}

				options._contentPane.append(options.itemTemplate.replace(options.replacementPattern, _itemValue));

				if ($.fn.jScrollPane) {
					options._pane.reinitialise();
				}

				$_item.val('');
				return false;
			});

			/**
			 * Show the trash can icon on hover
			 */
			options._contentPane.on('mouseenter mouseleave mouseenter.jsp mouseleave.jsp', 'li',function(e) {
				if ('mouseenter' == e.type) {
					$('i.fa', $(this)).removeClass('hide');
				}
				else {
					$('i.fa', $(this)).addClass('hide');
				}
			}).on('click', 'li, li a',function(e) {
					e.preventDefault();
					$(this).siblings('li').removeClass('active');
					$(this).addClass('active');
				}).on('click', 'li a i.fa', function(e) {
					e.preventDefault();
					if (confirm('Remove this ' + options.singletonName + '?')) {
						$(this).closest('li').remove();
						if ($.fn.jScrollPane) {
							options._pane.reinitialise();
						}
						if (options.afterDelete) {
							options.afterDelete(this);
						}
					}
				});

			if ($.validator) {
				$.validator.addMethod('vm_df_item_validator', function(value, element) {
					var _re = new RegExp(options.validPattern, 'g');
					return this.optional(element) || _re.test(value);
				}, 'Variables may only contain letters, numbers, and . - or _');

				$.validator.addClassRules('df-item', {
					vm_df_item_validator: true
				});
			}
		});
	};

	//**************************************************************************
	//* Default Options
	//**************************************************************************

	$.fn.multientry.options = {

		formId:             null,
		hidden:             false,
		model:              null,
		attribute:          null,
		items:              [],
		validateOptions:    {},
		gridSize:           'sm', //	lg, md, sm, or xs
		placeholder:        'Enter an item to add',
		label:              'Item(s)',
		singletonName:      'item',
		labelSize:          2,
		divClass:           'form-group',
		labelClass:         'control-label',
		inputClass:         'form-control',
		inputSize:          null,
		innerDivClass:      'well well-sm',
		ulClass:            'item-list',
		minimumHeight:      '120px',
		duplicateCheck:     null,
		buttonClass:        'btn btn-primary add-new-item',
		replacementTag:     '{{item}}',
		replacementPattern: '/{{item}}/gi',
		validPattern:       '^([A-Za-z0-9\_\.\-])+$',
		name:               null, //	Or set data-name
		id:                 null, //	Or set data-id
		itemTemplate:       '<li><a href="#">{{item}}<i title="Click to delete" class="fa fa-trash-o pull-right df-multientry-item label label-danger hide"></i></a></li>',
		afterDelete:        function(el) {
			return true;
		},
		afterInsert:        function(el) {
			return true;
		},
		_pane:              null,
		_contentPane:       null
	};

})(jQuery, window, document);
