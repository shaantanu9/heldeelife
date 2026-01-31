'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  message: string
  timestamp: Date
}

interface LiveChatProps {
  position?: 'bottom-right' | 'bottom-left'
  autoOpen?: boolean
  delay?: number
}

export function LiveChat({
  position = 'bottom-right',
  autoOpen = false,
  delay = 30000, // 30 seconds
}: LiveChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      message: 'Hello! How can I help you today?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-open after delay
  useEffect(() => {
    if (autoOpen && !isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [autoOpen, delay, isOpen])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate bot response (in production, this would call an API)
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: getBotResponse(userMessage.message),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
      setIsTyping(false)
    }, 1000)
  }

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return 'Our prices are competitive and we offer free shipping on orders above Rs. 500. Would you like to see products in a specific price range?'
    }

    if (
      lowerMessage.includes('shipping') ||
      lowerMessage.includes('delivery')
    ) {
      return 'We offer free shipping on orders above Rs. 500. Standard delivery takes 3-5 business days. Express delivery (1-2 days) is available for an additional charge.'
    }

    if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
      return 'We offer easy returns within 7 days of delivery. Products must be unopened and in original packaging. Would you like more details?'
    }

    if (lowerMessage.includes('product') || lowerMessage.includes('item')) {
      return 'I can help you find the perfect product! What are you looking for? You can search by product name, symptoms, or health concerns.'
    }

    if (lowerMessage.includes('order') || lowerMessage.includes('track')) {
      return 'You can track your order from your profile page. If you need help with a specific order, please provide your order number.'
    }

    if (lowerMessage.includes('discount') || lowerMessage.includes('coupon')) {
      return 'We have special offers and discounts available! Check our daily deals section or use code WELCOME10 for 10% off your first order.'
    }

    return "I'm here to help! You can ask me about products, shipping, returns, or anything else. For immediate assistance, you can also call us at +91-XXXX-XXXXXX."
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed z-50 rounded-full shadow-lg h-14 w-14 p-0',
          position === 'bottom-right'
            ? 'bottom-20 right-4'
            : 'bottom-20 left-4',
          'bg-orange-600 hover:bg-orange-700 text-white'
        )}
        aria-label="Open live chat"
      >
        <MessageCircle className="h-6 w-6" />
        {!isOpen && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
          >
            !
          </Badge>
        )}
      </Button>

      {/* Chat Window */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side={position === 'bottom-right' ? 'right' : 'left'}
          className="w-full sm:w-[400px] p-0 flex flex-col"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-orange-600" />
                  Live Chat Support
                </SheetTitle>
                <SheetDescription className="mt-1">
                  We&apos;re here to help! Ask us anything.
                </SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.type === 'bot' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-orange-600" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-4 py-2',
                      message.type === 'user'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    )}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        message.type === 'user'
                          ? 'text-orange-100'
                          : 'text-gray-500'
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {message.type === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="px-6 py-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Usually replies within a few minutes
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}









