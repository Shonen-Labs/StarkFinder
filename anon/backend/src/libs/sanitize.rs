use ammonia::Builder;
use maplit::hashset;
use once_cell::sync::Lazy;

static SANITIZER: Lazy<Builder<'static>> = Lazy::new(|| {
    let mut builder = Builder::new();
    // Allow only basic text formatting tags
    builder.tags(hashset!["p", "br", "b", "i", "em", "strong"]);
    // Remove all attributes
    builder.link_rel(None);
    builder.add_generic_attributes::<&str, _>(hashset![]);
    builder
});

pub fn sanitize_text(text: &str) -> String {
    SANITIZER.clean(text).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_text() {
        let input =
            r#"<p>Hello <script>alert('xss')</script></p><img src="x" onerror="alert(1)"/>"#;
        let expected = "<p>Hello </p>";
        assert_eq!(sanitize_text(input), expected);

        let input = r#"<p>This is <strong>bold</strong> and <em>italic</em></p>"#;
        assert_eq!(sanitize_text(input), input);
    }
}
