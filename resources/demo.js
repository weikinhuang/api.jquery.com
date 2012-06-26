$("code.demo-code").each(function(index) {
  var $example = $(this),
      $demo = $('div.code-demo').eq(index);

  var source = $example.html()
        .replace(/<\/?a.*?>/ig, "")
        .replace(/<\/?strong.*?>/ig, "")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");

  var iframe = document.createElement("iframe");
  iframe.src = "/resources/index-blank.html";
  iframe.width = "100%";
  iframe.height = $demo.attr("rel") || "125";
  iframe.style.border = "none";
  $demo.html(iframe);

  var doc = iframe.contentDocument ||
            (iframe.contentWindow && iframe.contentWindow.document) ||
            iframe.document ||
            null;

  if (doc == null) {
    return true;
  }
  var example = $example.text();

  var reTmpl = /((?:<|>|&gt;|&lt;)\/?)tmpl/g;
  if ( reTmpl.test(example) ) {
    $example.text( example.replace(reTmpl,'$1script') );
  }

  source = source
        .replace(/<script>([^<])/g,"<script>window.onload = (function(){\r\ntry{$1")
        .replace(/([^>])<\/sc/g,  "$1\r\n}catch(e){}});</sc")
        .replace(/(<\/?)tmpl/g,'$1script');

  source = source
        .replace("</head>", "<style>html,body{border:0; margin:0; padding:0;}</style></head>");

  doc.open();
  doc.write( source );
  doc.close();

});


if (typeof prettyPrint == 'function') {
  prettyPrint();
}