# Meet Captions Extractor — build & release tasks

# Extension version, read from manifest.json
version := `node -p "require('./manifest.json').version"`

# Name used for the dist folder and zip artifact
name := "meet-captions-extractor"

# Runtime files shipped to users (no tests, no dev/config files)
ship := "manifest.json core.js content.js styles.css README.md"

# Show available recipes
default:
    @just --list

# Run unit tests
test:
    node --test

# Build dist/ with only runtime files and a versioned zip
build: clean
    mkdir -p dist/{{name}}
    cp {{ship}} dist/{{name}}/
    cd dist && zip -r {{name}}-{{version}}.zip {{name}} > /dev/null
    @echo "Built dist/{{name}}-{{version}}.zip"

# Remove build output
clean:
    rm -rf dist

# Build and publish a GitHub release with the zip attached
release: test build
    gh release create v{{version}} \
        dist/{{name}}-{{version}}.zip \
        --title "v{{version}}" \
        --notes-file RELEASE_NOTES.md
