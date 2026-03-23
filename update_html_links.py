#!/usr/bin/env python3
import os
import re

# Template folder path
templates_dir = "/Users/shivamgautam/Desktop/Face-Authentication-Using-Python/Templates"

# Replacements to make
replacements = [
    # Static file paths
    (r'href="css/style\.css"', 'href="/static/css/style.css"'),
    (r"href='css/style\.css'", "href='/static/css/style.css'"),
    (r'src="js/main\.js"', 'src="/static/js/main.js"'),
    (r"src='js/main\.js'", "src='/static/js/main.js'"),
    
    # Navigation links - href attributes
    (r'href="index\.html"', 'href="/"'),
    (r"href='index\.html'", "href='/'"),
    (r'href="features\.html"', 'href="/features"'),
    (r"href='features\.html'", "href='/features'"),
    (r'href="demo\.html"', 'href="/demo"'),
    (r"href='demo\.html'", "href='/demo'"),
    (r'href="pricing\.html"', 'href="/pricing"'),
    (r"href='pricing\.html'", "href='/pricing'"),
    (r'href="login\.html"', 'href="/login"'),
    (r"href='login\.html'", "href='/login'"),
    (r'href="register\.html"', 'href="/register"'),
    (r"href='register\.html'", "href='/register'"),
    (r'href="dashboard\.html"', 'href="/dashboard"'),
    (r"href='dashboard\.html'", "href='/dashboard'"),
    
    # onclick handlers with window.location.href  
    (r"window\.location\.href\s*=\s*['\"]index\.html['\"]", "window.location.href='/'"),
    (r"window\.location\.href\s*=\s*['\"]features\.html['\"]", "window.location.href='/features'"),
    (r"window\.location\.href\s*=\s*['\"]demo\.html['\"]", "window.location.href='/demo'"),
    (r"window\.location\.href\s*=\s*['\"]pricing\.html['\"]", "window.location.href='/pricing'"),
    (r"window\.location\.href\s*=\s*['\"]login\.html['\"]", "window.location.href='/login'"),
    (r"window\.location\.href\s*=\s*['\"]register\.html['\"]", "window.location.href='/register'"),
    (r"window\.location\.href\s*=\s*['\"]dashboard\.html['\"]", "window.location.href='/dashboard'"),
]

# Process all HTML files
html_files = [f for f in os.listdir(templates_dir) if f.endswith('.html')]
updated_files = []

for html_file in html_files:
    filepath = os.path.join(templates_dir, html_file)
    with open(filepath, 'r', encoding='utf-8') as f:
        original_content = f.read()
    
    content = original_content
    changes_made = 0
    
    # Apply all replacements
    for pattern, replacement in replacements:
        new_content, count = re.subn(pattern, replacement, content)
        if count > 0:
            content = new_content
            changes_made += count
    
    # Write back if changes were made
    if changes_made > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        updated_files.append((html_file, changes_made))
        print(f"✓ {html_file}: {changes_made} changes")
    else:
        print(f"  {html_file}: no changes needed")

print(f"\nTotal files updated: {len(updated_files)}")
