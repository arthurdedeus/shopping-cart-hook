import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

async function getAmountInStock(productId: number) {
  const response = await api.get('/stock/' + String(productId))
  return response.data.amount
}

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      console.log(JSON.parse(storagedCart))
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      if (cart.map(product => product.id).includes(productId)) {
        const newAmount = cart.filter(
            product => product.id === productId
          )[0].amount + 1
        const amountInStock = await getAmountInStock(productId)

        if (newAmount >  amountInStock) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }

        var newCart = cart.map(product => (
          product.id === productId ? {...product, amount: newAmount} : product
          ))

      } else {
        const response = await api.get('/products/' + String(productId))
        const newProduct : Product = {...response.data, amount: 1}
        var newCart = [...cart, newProduct]
      }

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch {
      toast.error("Erro na adição do produto")
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (!cart.map(product => product.id).includes(productId)) {
        toast.error('Erro na remoção do produto');
        return
      }

      const newCart = cart.filter(product => (
        product.id !== productId
      ))

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0){
        return
      }

      const amountInStock = await getAmountInStock(productId)
      console.log(amountInStock)
      if (amount > amountInStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const newCart = cart.map(product => (
        product.id === productId ? {...product, amount: amount}: product
      ))

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto")
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
