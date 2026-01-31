'use client'

import { useEffect, useRef } from 'react'
import { ProductEmbed } from './product-embed'

interface BlogContentRendererProps {
  content: string
  className?: string
}

export function BlogContentRenderer({
  content,
  className = '',
}: BlogContentRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return

    // Find all product embed placeholders
    const productEmbeds = contentRef.current.querySelectorAll(
      '.blog-product-embed'
    )

    productEmbeds.forEach((embed) => {
      const productId = embed.getAttribute('data-product-id')
      const productName = embed.getAttribute('data-product-name') || ''
      const productSlug = embed.getAttribute('data-product-slug') || ''
      const productPrice = parseFloat(
        embed.getAttribute('data-product-price') || '0'
      )
      const productImage = embed.getAttribute('data-product-image') || ''
      const productDescription =
        embed.getAttribute('data-product-description') || ''
      const productCategory = embed.getAttribute('data-product-category') || ''

      if (productId) {
        // Create a container for the React component
        const container = document.createElement('div')
        container.className = 'product-embed-container my-8'

        // Replace the placeholder with the container
        embed.replaceWith(container)

        // Render the ProductEmbed component
        // We'll use a simple approach: create the HTML structure
        // For full React rendering, we'd need ReactDOM.render or similar
        container.innerHTML = `
          <div 
            data-react-product-embed
            data-product-id="${productId}"
            data-product-name="${productName}"
            data-product-slug="${productSlug}"
            data-product-price="${productPrice}"
            data-product-image="${productImage}"
            data-product-description="${productDescription}"
            data-product-category="${productCategory}"
          ></div>
        `
      }
    })
  }, [content])

  return (
    <div
      ref={contentRef}
      className={`blog-content ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

// Client-side product embed renderer
export function ProductEmbedRenderer() {
  useEffect(() => {
    // Find all product embed containers
    const containers = document.querySelectorAll('[data-react-product-embed]')

    containers.forEach((container) => {
      if (container.querySelector('.product-embed-rendered')) return // Already rendered

      const productId = container.getAttribute('data-product-id')
      const productName = container.getAttribute('data-product-name') || ''
      const productSlug = container.getAttribute('data-product-slug') || ''
      const productPrice = parseFloat(
        container.getAttribute('data-product-price') || '0'
      )
      const productImage = container.getAttribute('data-product-image') || ''
      const productDescription =
        container.getAttribute('data-product-description') || ''
      const productCategory =
        container.getAttribute('data-product-category') || ''

      if (productId && container.parentElement) {
        // Mark as rendered
        container.classList.add('product-embed-rendered')

        // Create a wrapper for React component
        const wrapper = document.createElement('div')
        container.parentElement.replaceChild(wrapper, container)

        // We'll render this using React in the parent component
        // For now, we'll use a simpler approach with a custom element
        wrapper.innerHTML = `
          <div class="product-embed-wrapper" data-product-id="${productId}">
            <!-- Product embed will be rendered here by ProductEmbed component -->
          </div>
        `
      }
    })
  }, [])

  return null
}








