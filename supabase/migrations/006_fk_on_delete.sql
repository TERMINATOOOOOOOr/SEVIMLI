-- ============================================================
-- SEVIMLI — миграция 006: поведение внешних ключей при удалении.
-- Удаление аккаунта (право субъекта ПДн) и магазина не должно блокироваться
-- историей заказов: ссылки на удалённого покупателя/товар обнуляются,
-- сами заказы и позиции (цена на момент заказа) остаются у продавца.
-- ============================================================

-- orders.buyer_id → при удалении профиля заказ остаётся, покупатель обезличивается
alter table public.orders drop constraint if exists orders_buyer_id_fkey;
alter table public.orders
  add constraint orders_buyer_id_fkey
  foreign key (buyer_id) references public.profiles(id) on delete set null;

-- orders.shop_id → при удалении магазина его заказы удаляются вместе с позициями
alter table public.orders drop constraint if exists orders_shop_id_fkey;
alter table public.orders
  add constraint orders_shop_id_fkey
  foreign key (shop_id) references public.shops(id) on delete cascade;

-- order_items.product_id → позиция остаётся с ценой на момент заказа
alter table public.order_items drop constraint if exists order_items_product_id_fkey;
alter table public.order_items
  add constraint order_items_product_id_fkey
  foreign key (product_id) references public.products(id) on delete set null;

-- reviews.user_id → отзыв остаётся без автора
alter table public.reviews drop constraint if exists reviews_user_id_fkey;
alter table public.reviews
  add constraint reviews_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

-- bookings: без покупательницы — обезличить, без салона — удалить
alter table public.bookings drop constraint if exists bookings_user_id_fkey;
alter table public.bookings
  add constraint bookings_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.bookings drop constraint if exists bookings_shop_id_fkey;
alter table public.bookings
  add constraint bookings_shop_id_fkey
  foreign key (shop_id) references public.shops(id) on delete cascade;

-- Функция самоудаления аккаунта (кнопка «Удалить аккаунт» в профиле): чистит auth.users,
-- профиль и связанные строки уходят каскадом/обнуляются по правилам выше.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  perform set_config('sevimli.bypass', '1', true);
  delete from auth.users where id = auth.uid();
end;
$$;
grant execute on function public.delete_my_account() to authenticated;
